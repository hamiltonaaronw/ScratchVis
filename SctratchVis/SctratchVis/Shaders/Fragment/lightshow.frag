#version 410

// based on https://glslsandbox.com/e#101857.0

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)
#define hr		vec2(1.0, sqrt(3.0))

#define circle(p, s)	(length(p) - s)
#define hex(p, s)		(max(abs(p.x), dot(abs(p), normalize(hr))) - s)
#define sm(t, v)		smoothstep(t, t * 1.2, v)
#define hash21(x)		fract(sin(dot(x, vec2(164.5, 234.1))) * 594.5)
#define hash11(x)		fract(sin(x) * 6497.5)
#define dt(sp, off)		fract((uTime + off) * sp)

out vec4 retColor;

uniform float uFreq;
uniform float uTime;
uniform float uLastFreq;
uniform float uDeltaTime;
uniform float[256] uSpectrum;
uniform vec2 uRes;




mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
}

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

vec4 hgrid(vec2 uv)
{
	vec2 ga = mod(uv, hr) - hr * 0.5;
	vec2 gb = mod(uv - hr * 0.5, hr) - hr * 0.5;
	vec2 guv = (dot(ga, ga) < dot(gb, gb)) ? ga : gb;
	vec2 gid = uv - guv;

	return vec4(guv, gid);
}

float extrude(vec3 p, float d, float h)
{
	vec2 q = vec2(d, abs(p.z) - h);

	return min(0.0, max(q.x, q.y)) + length(max(q, 0.0));
}

float truchet(vec2 uv, float w, float sdfid, bool back)
{
	vec4 hg = hgrid(uv);
	vec2 uu = hg.xy;
	vec2 id = hg.zw;
	uu.x *= (hash21((id + 1.0 + sdfid) * 0.1) < 0.5) ? -1.0 : 1.0;

	float s = (uu.x * sqrt(3.0) >- uu.y) ? 1.0 : -1.0;
	float diag;
	if (back)
		diag = sm(0.01, abs(uu.y + uu.x * sqrt(3.0)));
	else
		diag = abs(uu.y + uu.x * sqrt(3.0));

	uu -= vec2(1.0, 1.0 / sqrt(3.0)) * s * 0.5;
	float contour;

	if (back)
		contour = sm(0.02, abs(circle(uu, 0.29)));
	else
		contour = abs(circle(uu, sqrt(3.0) / 6.0));


	contour *= diag;

	return contour - w;
}

float g1 = 0.0;
float sid;
float SDF(vec3 p)
{
	p.z += uTime;
	float per = 2.0;
	sid = floor(p.z / per);
	p.z = mod(p.z, per) - per * 0.5;
	float d = extrude(p.xyz, truchet(p.xy + 0.5, sin(length(p.xy * 3.0) - dt(0.5, sid * 0.2) * TAU) * 0.02 + 0.01, sid * 0.5, false), 0.1);
	g1 += 0.01 / (0.01 + d * d);

	return d;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	vec3 vf = vec3(
		uSpectrum[31] / f,
		uSpectrum[63] - f,
		uSpectrum[127] * f
	) + uSpectrum[254];

	float dither = hash21(p);
	vec3 ro = vec3(0.001, 0.001, -5.0);
	vec3 rd = normalize(vec3(p, 1.0));
	vec3 q = ro;
	c = clamp(1.0 - vec3(truchet(p * 3.0, 0.01, 1.0, true)), 0.0, 1.0);

	bool hit = false;
	float shad;

	for (float i = 1.0; i < 50.0; i++)
	{
		float d = SDF(q);
		if (abs(d) < 0.001)
		{
			hit = true;
			shad = i / 64.0;
			break;
		}
		d *= 0.99 + dither * 0.05;
		q += d * rd;
	}

	if (hit)
		c = vec3(1.0 - shad);

	c += g1 * vec3(0.9, 0.4, 0.0) * 0.03;

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv;
	uv = (gl_FragCoord.xy - 0.5 - uRes) / min(uRes.x, uRes.y);

	retColor = vec4(col(uv), 1.0);
}