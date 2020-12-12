#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)
#define MIN_DIST 0.0001
#define MAX_DIST 1-+75.0

uniform float uFreq;
uniform float uLastFreq;
uniform float uTime;
uniform vec2 uRes;

#define cosc(x) cos(x) / x
#define sinc(x) sin(x) / x

out vec4 retColor;

mat2 rot(float a)
{
	return mat2(
		cos(a), -sin(a),
		sin(a), cos(a)
	);
}

vec2 hash22(vec2 p)
{
	float n = sin(dot(p, vec2(31.0, 289.0)));
	p = fract(vec2(362144.0, 42768.0) * n);

	vec2 ret;

	ret = sin(p * 7.2831853 + uTime) * 0.55 + 0.5;

	return ret;
}

float voronoi(vec2 p)
{
	vec2 g = floor(p);
	vec2 o;
	vec3 d = vec3(2.0);

	for (int y = -2; y <= 2; y++)
		for (int x = -2; x <= 2; x++)
		{
			o = vec2(x, y);
			o += hash22(g + o) - p;
			d.z = dot(o, o);

			d.y = max(d.x, min(d.y, d.z));
			d.x = min(d.x, d.z);
		}

	float ret;

	ret = max(d.y / 0.6 - d.x * 0.5, 0.0) / 2.2;

	return ret;
}

float rnd(vec3 p) 
{
    return fract(sin(dot(p, vec3(12.345, 67.89, 412.12))) * 42123.45) * 2.0 - 1.0;
}

float perlin(vec3 p)
{
	vec3 u = floor(p);
	vec3 v = fract(p);
	vec3 s = smoothstep(0.0, 1.0, v);

	float a = rnd(u),
		  b = rnd(u + vec3(1.0, 0.0, 0.0)),
		  c = rnd(u + vec3(0.0, 1.0, 0.0)),
		  d = rnd(u + vec3(1.0, 1.0, 0.0)),
		  e = rnd(u + vec3(0.0, 0.0, 1.0)),
		  f = rnd(u + vec3(1.0, 0.0, 1.0)),
		  g = rnd(u + vec3(0.0, 1.0, 1.0)),
		  h = rnd(u + vec3(1.0, 1.0, 1.0));

	float ret = mix(mix(mix(a, b, s.x), mix(c, d, s.x), s.y),
					mix(mix(e, f, s.x), mix(g, h, s.x), s.y),
					s.z);
	return ret;
}

float hd(vec2 p)
{
	return max(dot(abs(p), normalize(vec2(1.0, 1.73))), abs(p.x));
}

vec4 hx(vec2 p)
{
	vec2 r = vec2(1.0, 1.73);
	vec2 hr = r * 0.5;
	vec2 ga = mod(p, r) - hr;
	vec2 gb = mod(p - hr, r) - hr;
	vec2 g = dot(ga, ga) < dot(gb, gb) ? ga : gb;

	vec4 ret;

	ret = vec4(atan(g.x, g.y), 0.5 - hd(g), (p - g));

	return ret;
}

vec3 col(vec2 p)
{
	vec3 ret;

	vec2 u;
	//u = (2.0 * gl_FragCoord.xy - uRes.xy) / max(uRes.x, uRes.y);
	u = p;

	float f = mod(fract(uFreq * 100.0), fract(uFreq * 10.0)) * sinc(uTime / sin(uFreq));
	float maxF = max(f, uFreq);
	float minF = min(f, uFreq);

	vec3 lp = vec3(0.0);
	vec3 ro = vec3(-3.21, 13.0, -12.0);

	vec3 cf = normalize(lp - ro);
	vec3 cp = vec3(0.0, 1.0, 0.0);
	vec3 cr = normalize(cross(cp, cf));
	vec3 cu = normalize(cross(cf, cr));
	vec3 _c = ro + cf * 0.95;
	vec3 i = _c + u.x * cr + u.y * cu;
	vec3 rd = i - ro;
	vec3 _C = vec3(0.0);
	vec3 _p = vec3(0.0);
	vec4 _t = vec4(0.0);
	vec4 d = vec4(0.0);

	// bumping
	float t = sin(uTime) / voronoi(vec2(mod(maxF, minF)));
	t *= 0.5;

	float pr;
	for (int i = 0; i < 36; i++)
	{
		_p = ro + d.x * rd;

		_p.xz * mat2(cos(uTime * 0.16 + vec4(0.0, 11.0, 33.0, 0.0)));
		vec4 h = hx(_p.xz * 0.25) * 1.0;
		float _pr = perlin(vec3(h.zw * 0.4, t * 1.25)) * 1.75;
		float hMap = 0.12 * (_p.y - _pr) / 1.0;
		pr = _pr;
		_t = vec4(hMap, pr, h.z, h.y);

		d.yzw = _t.yzw;

		if (_t.x < 0.005 * d.x || d.x > 50.0 + sinc(f))
			break;

		d.x = _t.x;
	}
	
	// freq -> color
	float co = sin(uFreq);
	// brightness
	float ao = fract(uFreq * 10.0);
	float ac = co * ao;
	float _a1 = minF; //mod(uFreq * 10.0, 1.25);
	float _a2 = sin(maxF);//sin(uTime) + uFreq;

	vec3 m = ao * cos(2.0 * pr + vec3(1.0, _a1, _a2));
	m += mod(sin(uTime), sinc(minF));

	if (d.x < 48.0)
		_C += m * smoothstep(0.4, 0.05, d.w);

	ret = vec3(pow(abs(_C), vec3(1.0)));

	return ret;
}

void main()
{	
	vec4 ret;
	vec2 uv;

	uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y);
	uv *= 5.0;

	ret = vec4(col(uv * 1.75), 1.0);

	retColor = ret;
}