#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

out vec4 retColor;

uniform float uFreq;
uniform float uTime;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform vec2 uRes;

#define R(p, a, r) mix(a * dot(p, a), p, cos(r)) + sin(r) * cross(p, a)
#define H(h) (cos((h) * 6.3 + vec3(0, 23, 21)) * 0.5 + 0.5)

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

mat2 rot(float a)
{
	mat2 ret = mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);

	return ret;
}

vec3 hsv2rgb(float h, float s, float v)
{
	return ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);
	vec4 co = vec4(0.0);

	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	float tm = mod(uTime, PI / 10.0);
	float ff = smoothstep(min(f, tm), max(uFreq, tm) * uFreq, cosc(TAU) + uLastFreq);
	float tf = atan(tm, ff);
	float fsum = (uFreq - uLastFreq) + f + tm + ff + tf;
	fsum *= 0.5;
	fsum *= 0.75;

	vec3 q;
	vec3 r = vec3(uRes, 1.0 + ff);
	vec3 d = normalize(vec3((p - 0.5 * r.xy) / r.y, 1.0));

	float g = 0.0;
	float e;
	float s;

	for (float i = 0.0; i < 59.0; ++i)
	{
		q = R(g * d, vec3(0.577), 0.2);
//q.z += uTime / 14.0;
		//q.z += uTime / (14.0 / sinc(1.0 - fract(fsum)));
		q.z += fract(uTime + sin(fsum)) / 7.0;// (14.0 / sinc(1.0 - fract(fsum)));
		q = fract(q) - 0.5;

		s = 3.0;

		for (int j = 0; j < 6; ++j)
		{
			q = abs(q);
//q = q.x < q.z ? q.zxy : q.zyx;
			q = q.x < q.z ? q.zxy : q.zyx;
//s *= e = 2.0 / min(dot(q, q), 1.0);
			s *= e = 2.0 / min(dot(q, q), 1.0 - fract(fsum));
//q = q * e - vec3(0.2, 1.0, 4.0);
			q = q * e - vec3(0.2 * sinc(fsum), 1.0, 4.0);
		}

		g += e = length(q) / s;
//co.rgb += mix(r / r, H(log(s)), 0.4) * 0.02 * exp(-0.5 * i * i * e);
		co.rgb += mix(r / r, H(log(s * fsum)), abs(1.0 - fract(fsum))) * 0.02 * exp(-0.5 * i * i * e);
	}

	c = co.xyz;

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.001 ? c : vec3(0.0);

	return ret;
}

void main() 
{
	vec2 uv = gl_FragCoord.xy * 0.75;
	uv.x -= 1.75;
	uv.y -= 100.0;
	vec4 ret;

	ret = vec4(col(uv), 1.0);
	retColor = ret;

}